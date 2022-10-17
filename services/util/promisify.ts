export function promisifyEvent(target: EventTarget, eventName: string): Promise<Event> {
  return new Promise(async (resolve) => {
    const onEvent = function(event: Event) {
      target.removeEventListener(eventName, onEvent);
      resolve(event);
    }
    target.addEventListener(eventName, onEvent);
  })
} 

export function promisifyTimeout(timeout: number): Promise<undefined> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  })
}