
/**
 * An event loop with one-time and repeating events
 */

//% weight=100 color=#8a8bd1 icon="⧖"
namespace scheduler {

    type Event = {
        cb: () => void,
        repeating: boolean,
        interval: number,
        when: number
    };

    type PQNode<T> = {
        priority: number,
        data: T
    }

    class PQ<T> {
        nodes: Array<PQNode<T>>

        constructor() {
            this.nodes = []
        }

        insert(priority: number, data: T) {
            this.nodes.push({ priority: priority, data: data })
            this.upHeap(this.nodes.length - 1)
        }

        peekMin(): T {
            if (this.nodes.length > 0) {
                return this.nodes[0].data
            }
            return null
        }

        removeMin(): T {
            if (this.nodes.length > 0) {
                let data = this.nodes[0].data
                this.nodes[0] = this.nodes[this.nodes.length - 1]
                this.nodes.pop()
                this.downHeap(0)
                return data
            }
            return null
        }

        parent(index: number): number {
            return ((index - 1) / 2) >> 0
        }

        leftChild(index: number): number {
            return index * 2 + 1
        }

        rightChild(index: number): number {
            return index * 2 + 2
        }

        upHeap(index: number) {
            let node = this.nodes[index]
            if (index > 0) {
                let parentIndex = this.parent(index)
                let parent = this.nodes[parentIndex]
                if (parent.priority > node.priority) {
                    this.nodes[parentIndex] = node
                    this.nodes[index] = parent
                    this.upHeap(parentIndex)
                }
            }
        }

        downHeap(index: number) {
            let node = this.nodes[index]
            if (this.leftChild(index) < this.nodes.length) {
                let leftIndex = this.leftChild(index)
                let left = this.nodes[leftIndex]
                if (this.rightChild(index) < this.nodes.length) {
                    let rightIndex = this.rightChild(index)
                    let right = this.nodes[rightIndex]
                    if (right.priority < node.priority && right.priority < left.priority) {
                        this.nodes[rightIndex] = node
                        this.nodes[index] = right
                        this.downHeap(rightIndex)
                        return
                    }
                }
                if (left.priority < node.priority) {
                    this.nodes[leftIndex] = node
                    this.nodes[index] = left
                    this.downHeap(leftIndex)
                }
            }
        }


    }

    let queue = new PQ<Event>()
    let clock = 0
    let debug = false

    function schedule(event: Event) {
        queue.insert(event.when, event)
    }

    function debuglog(s: string) {
        if (debug) {
            console.log(s)
        }
    }

    /**
     * Run some code after n seconds
     * @param n number of seconds, eg: 5
     */
    //% blockId=do_once block="do once after %n seconds" blockGap=8
    //% n.min=1
    export function do_once(n: number, f: () => void) {
        let micros = n * 1000000
        let event = {
            cb: f,
            when: clock + micros + 1, // make sure "once" events always happen after "every" events
            repeating: false,
            interval: 0
        }
        schedule(event)
    }

    /**
     * Run some code every n seconds
     * @param n number of seconds, eg: 5
     */
    //% blockId=do_every block="do every %n seconds" blockGap=8
    //% n.min=1
    export function do_every(n: number, f: () => void) {
        let micros = n * 1000000
        let event = {
            cb: f,
            when: clock + micros,
            repeating: true,
            interval: micros
        }
        schedule(event)
    }

    /**
     * Run some code every n seconds, starting after o seconds
     * @param n number of seconds, eg: 5
     */
    //% blockId=do_every_offset block="do every %n seconds, starting in %o seconds" blockGap=8
    //% n.min=1
    export function do_every_offset(n: number, o: number, f: () => void) {
        let micros = n * 1000000
        let offset = o * 1000000
        let event = {
            cb: f,
            when: clock + offset,
            repeating: true,
            interval: micros
        }
        schedule(event)
    }

    
    /**
     * Run the timing event loop
     */
    //% blockId=event_loop block="run 'once' and 'every' events"
    export function event_loop() {
        debuglog(`event loop wake, clock is ${clock}, ${queue.nodes.length} events in PQ`)
        let next = queue.removeMin()
        if (!next) {
            debuglog("no events, waiting 1")
            control.waitMicros(1)
        }
        else if (next.when > clock) {
            debuglog(`going to wait for event at ${next.when}`)
            let wait = next.when - clock
            clock = next.when
            debuglog(`waiting ${wait} for next event`)
            control.waitMicros(wait)
        }
        debuglog(`firing event at ${next.when}`)
        if (next.repeating) {
            debuglog(`scheduling repeat at interval ${next.interval}`)
            schedule({
                cb: next.cb,
                when: clock + next.interval,
                repeating: true,
                interval: next.interval
            })
        }
        next.cb()
    }
}
