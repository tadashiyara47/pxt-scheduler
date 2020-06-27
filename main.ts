
/**
 * An event loop with one-time and repeating events
 */

//% weight=100 color=#8a8bd1 icon="⧖"
namespace scheduler {

    type Event = {
        cb: (seconds: number) => void,
        repeating: boolean,
        interval: number,
        when: number
    };

    class PQ {
        nodes: Array<Event>

        constructor() {
            this.nodes = []
        }

        lt(event1: Event, event2: Event): boolean {
            if (event1.when == event2.when) {
                if (event1.repeating != event2.repeating) {
                    return event2.repeating
                } else {
                    return event1.interval < event2.interval
                }
            } else {
                return event1.when < event2.when
            }
        }

        insert(event: Event) {
            this.nodes.push(event)
            this.upHeap(this.nodes.length - 1)
        }

        peekMin(): Event {
            if (this.nodes.length > 0) {
                return this.nodes[0]
            }
            return null
        }

        removeMin(): Event {
            if (this.nodes.length > 0) {
                let data = this.nodes[0]
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
                if (this.lt(node, parent)) {
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
                    if (this.lt(right, node) && this.lt(right, left)) {
                        this.nodes[rightIndex] = node
                        this.nodes[index] = right
                        this.downHeap(rightIndex)
                        return
                    }
                }
                if (this.lt(left, node)) {
                    this.nodes[leftIndex] = node
                    this.nodes[index] = left
                    this.downHeap(leftIndex)
                }
            }
        }


    }

    let queue = new PQ()
    let clock = 0
    export let debug = false

    function schedule(event: Event) {
        queue.insert(event)
    }

    function debuglog(s: string) {
        if (debug) {
            console.log(s)
        }
    }

    /**
     * Run code every n-second "tick"
     * @param n number of seconds, eg: 1
     */
    //% blockId=tick_every block="%n second tick" blockGap=8
    //% n.min=1
    export function tick_every(n: number, f: (seconds: number) => void) {
        do_every_offset(n * 2, 0, f)

    }

    /**
     * Run code every n-second "tock"
     * @param n number of seconds, eg: 1
     */
    //% blockId=tock_every_ block="%n second tock" blockGap=8
    //% n.min=1
    export function tock_every(n: number, f: (seconds: number) => void) {
        do_every_offset(n * 2, n, f)
    }

    /**
     * Run code after n seconds
     * @param n number of seconds, eg: 5
     */
    //% blockId=do_once block="do once after %n seconds" blockGap=8
    //% n.min=1
    export function do_once(n: number, f: (seconds: number) => void) {
        let micros = n * 1000000
        let event = {
            cb: f,
            when: clock + micros, // make sure "once" events always happen after "every" events
            repeating: false,
            interval: 0
        }
        schedule(event)
    }

    /**
     * Run some code every n seconds, starting after o seconds
     * @param n number of seconds, eg: 5
     */
    //% blockId=do_every_offset block="do every %n seconds, starting in %o seconds" blockGap=8
    //% n.min=1
    export function do_every_offset(n: number, o: number, f: (seconds: number) => void) {
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
    //% blockId=event_loop block="run scheduler events"
    export function event_loop() {
        debuglog(`event loop wake, clock is ${clock}, ${queue.nodes.length} events in PQ`)
        let next = queue.removeMin()
        if (!next) {
            debuglog("no events, waiting 1")
            control.waitMicros(1)
            return
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
        next.cb((clock / 1000000) >> 0)
    }
}
