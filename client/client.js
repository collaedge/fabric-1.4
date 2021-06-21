const PubNub = require("pubnub");
const prompt = require('prompt-sync')();
const AccessLedger = require('./accessLedger');


ID = ""
candidates = []

const pubnub = new PubNub({
  publishKey: "pub-c-0f0864b8-4a7a-4059-89b9-1d083b503ca6",
  subscribeKey: "sub-c-73b0bad0-500e-11eb-a73a-1eec528e8f1f",
  uuid: "myUniqueUUID",
});

async function publishTask(publisherId, deadline, baseRewards) {
  console.log("publishing task ...");
  let d = new Date();
  let currentTime = d.getTime();
  const result = await pubnub.publish({
    channel: "mychannel",
    message: {
      type: "pub",
      publisherId: publisherId,
      deadline: deadline,
      baseRewards: baseRewards,
      publishTime: currentTime.toString()
    },
  });
  // console.log(result);
}

async function sendResToPub(msg) {
  try {
    console.log(`response to publisher: ${JSON.stringify(msg)}`);
    await pubnub.publish({
      channel: "mychannel",
      message: msg
    });
  } catch (error) {
    console.error(`Failed to send response: ${error}`);
  }
}

// function decideExecutor(msg) {
//   console.log(`send decision: ${JSON.stringify(msg)}`);
//   pubnub.publish({
//     channel: "mychannel",
//     message: msg
//   }).then((res) => console.log(res));
 
// }

async function decideExecutor(msg) {
  try {
    console.log(`send decision: ${JSON.stringify(msg)}`);
    await pubnub.publish({
      channel: "mychannel",
      message: msg
    },
    // function(status, response) {
    //   if (status.error) {
    //       console.log("publishing failed w/ status: ", status);
    //   } else {
    //       console.log("message published w/ server response: ", response);
    //   }
    // }
    );
  } catch (error) {
    console.error(`Failed to send response: ${error}`);
  }
}

function addListener() {
  pubnub.addListener({
    status: function (statusEvent) {
      // console.log("statusevent: ", statusEvent);
      if (statusEvent.category === "PNConnectedCategory") {
        // publishTask("400", "30");
      }
    },
    message: function (messageEvent) {
      /** candidates get tasks publish, return a response */
      if (ID != messageEvent.message.publisherId && messageEvent.message.type == "pub") {
        console.log("other servers receive publish")
        let publisherId = messageEvent.message.publisherId;
        let deadline = messageEvent.message.deadline;
        let baseRewards = messageEvent.message.baseRewards;
        let publishTime = messageEvent.message.publishTime;
        
        let msg = {
          type : "res",
          publisherId: publisherId,
          candidate: ID,
          des : publisherId,
          deadline : deadline,
          baseRewards : baseRewards,
          publishTime: publishTime
        }

        sendResToPub(msg);
      /** publisher gets response from candidates */  
      } else if (messageEvent.message.des == ID && messageEvent.message.type == "res") {
        console.log(messageEvent.message);
        let d = new Date();
        let currentTime = d.getTime();
        let publisherId = messageEvent.message.publisherId;
        let deadline = messageEvent.message.deadline;
        let baseRewards = messageEvent.message.baseRewards;
        let publishTime = parseFloat(messageEvent.message.publishTime);
        
        let candidate = {}
        candidate['id'] = messageEvent.message.candidate;
        candidate['value'] = (currentTime - publishTime).toString();
        candidates.push(candidate);
        console.log("candidates: ", candidates);

        if (candidates.length >= 2) {
          // choose executor, call function from accessLedger
          let msg = {}
          let access = new AccessLedger();
          access.chooseExecutor(candidates)
            .then(executor => {
              console.log("decide executor: ", executor);
              currentTime = d.getTime();
              msg = {
                type : "decide",
                publisherId: publisherId,
                executorId: executor,
                deadline : deadline,
                baseRewards : baseRewards,
                TaskStartTime: currentTime.toString(),
                workload: "workload"
              };
              // reset candidates
              candidates = [];
              // decideExecutor(msg);
            })
            .then(() => {
              decideExecutor(msg);
            });
        }
      } else if (messageEvent.message.type == "decide" && messageEvent.message.publisherId != ID) {
        console.log("receive decision: ", messageEvent.message);
        if (messageEvent.message.executorId == ID) {
          // do task
          setTimeout(function (params) {
            // return results by publish

          }, 400);
          //return
        } else {
          // log tart time for validation later

        }

      }
      // console.log("continuing");
    },
    presence: function (presenceEvent) {
      // handle presence
      console.log("presenceEvent: ", presenceEvent);
    },
  });
}

ID = prompt("input id: ");

addListener()

console.log("Subscribing..");

pubnub.subscribe({
  channels: ["mychannel"],
});

// publishTask("400", "30");

module.exports = {publishTask}
