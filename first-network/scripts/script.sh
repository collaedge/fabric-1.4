#!/bin/bash

echo
echo " ____    _____      _      ____    _____ "
echo "/ ___|  |_   _|    / \    |  _ \  |_   _|"
echo "\___ \    | |     / _ \   | |_) |   | |  "
echo " ___) |   | |    / ___ \  |  _ <    | |  "
echo "|____/    |_|   /_/   \_\ |_| \_\   |_|  "
echo
echo "Build your first network (BYFN) end-to-end test"
echo
CHANNEL_NAME="$1"
DELAY="$2"
LANGUAGE="$3"
TIMEOUT="$4"
VERBOSE="$5"
NO_CHAINCODE="$6"
: ${CHANNEL_NAME:="mychannel"}
: ${DELAY:="3"}
: ${LANGUAGE:="golang"}
: ${TIMEOUT:="10"}
: ${VERBOSE:="false"}
: ${NO_CHAINCODE:="false"}
LANGUAGE=`echo "$LANGUAGE" | tr [:upper:] [:lower:]`
COUNTER=1
MAX_RETRY=10

CC_SRC_PATH="github.com/chaincode/task/node/"
if [ "$LANGUAGE" = "node" ]; then
	CC_SRC_PATH="/opt/gopath/src/github.com/chaincode/task/node/"
fi

# if [ "$LANGUAGE" = "java" ]; then
# 	CC_SRC_PATH="/opt/gopath/src/github.com/chaincode/chaincode_example02/java/"
# fi

echo "Channel name : "$CHANNEL_NAME

# import utils
. scripts/utils.sh

createChannel() {
	setGlobals 0 1

	if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
                set -x
		peer channel create -o orderer.example.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx >&log.txt
		res=$?
                set +x
	else
				set -x
		peer channel create -o orderer.example.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA >&log.txt
		res=$?
				set +x
	fi
	cat log.txt
	verifyResult $res "Channel creation failed"
	echo "===================== Channel '$CHANNEL_NAME' created ===================== "
	echo
}

joinChannel () {
	for org in 1 2; do
	    # for peer in 0 1; do
		joinChannelWithRetry 0 $org
		echo "===================== peer0.org${org} joined channel '$CHANNEL_NAME' ===================== "
		sleep $DELAY
		echo
	    # done
	done
	# joinChannelWithRetry 2 2
	# 	echo "===================== peer2.org2 joined channel '$CHANNEL_NAME' ===================== "
}

## Create channel
echo "Creating channel..."
createChannel

## Join all the peers to the channel
echo "Having all peers join the channel..."
joinChannel

echo "wait for 10s"
sleep 10

## Set the anchor peers for each org in the channel
echo "Updating anchor peers for org1..."
updateAnchorPeers 0 1
echo "Updating anchor peers for org2..."
updateAnchorPeers 0 2

if [ "${NO_CHAINCODE}" != "true" ]; then

	## Install chaincode on peer0.org1 and peer0.org2
	echo "Installing chaincode on peer0.org1..."
	installChaincode 0 1
	echo "Install chaincode on peer0.org2..."
	installChaincode 0 2

	echo "Installing chaincode on peer1.org1..."
	installChaincode 1 1
	echo "Install chaincode on peer1.org2..."
	installChaincode 1 2

	# Instantiate chaincode on peer0.org1
	echo "Instantiating chaincode on peer0.org1..."
	instantiateChaincode 0 1

	echo "Waiting for instantiation request to be committed ..."
	sleep 10

	echo "Sending invoke transaction on peer0.org1"
	chaincodeInvoke 0 1

	# # Query chaincode on peer0.org1
	# echo "Querying chaincode on peer0.org1..."
	# chaincodeQuery 0 1 100

	# # Invoke chaincode on peer0.org1 and peer0.org2
	# echo "Sending invoke transaction on peer0.org1 peer0.org2..."
	# chaincodeInvoke 0 1 0 2
	
	# ## Install chaincode on peer1.org2
	# echo "Installing chaincode on peer2.org2..."
	# installChaincode 2 2

	# # Query on chaincode on peer1.org2, check if the result is 90
	# echo "Querying chaincode on peer2.org2..."
	# chaincodeQuery 2 2 90
	
fi

echo
echo "========= All GOOD, BYFN execution completed =========== "
echo

echo
echo " _____   _   _   ____   "
echo "| ____| | \ | | |  _ \  "
echo "|  _|   |  \| | | | | | "
echo "| |___  | |\  | | |_| | "
echo "|_____| |_| \_| |____/  "
echo

exit 0
