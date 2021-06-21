const AccessLedger = require('./accessLedger')


class Test {
    access = new AccessLedger();
    async testQueryByExecutor() {
        let executorId = 'server2';
        const result = await this.access.getTasksByExecutor(executorId);
        // console.log(result);
        console.log(result);
    };

    testCreate() {
        let d = new Date();
        let n = d.getTime();
        let executorId = "server3"
        let publisherId = "server4"
        let startTime = String(n)
        let endTime = String(n+650)
        let deadline = String(690)
        let baseRewards = String(15)
            
        this.access.createTask(executorId, publisherId, startTime, endTime, deadline, baseRewards)
    }

    async testCompRep() {
        let candidates = [{
            id: "server2",
            value : '4444'
        },
        {
            id : "server3",
            value : '3333'
        }
        ]
        
        let executor = await this.access.chooseExecutor(candidates);
        console.log("decide executor: ", executor);
    }
}


let t = new Test();
t.testCompRep()


// access.getAllTasks();

// let d = new Date();
// let n = d.getTime();
// let executorId = "server2"
// let publisherId = "server1"
// let startTime = String(n)
// let endTime = String(n+500)
// let deadline = String(600)
// let baseRewards = String(20)

// access.createTask(executorId, publisherId, startTime, endTime, deadline, baseRewards)
