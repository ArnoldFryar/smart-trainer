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

export function createForwardAndBackwardIterator<T>(asyncIterator: AsyncIterator<T>) {
  // An array to cache the values previously returned from the next method
  const previousValues: Array<IteratorResult<T> & { index:number}> = [];

  // The current index in the collection
  let currentIndex = 0;

  // The furthest index in the collection
  let furthestIndex = 0;

  return {
    next: async () => {
      // If the current index is not the furthest index, return the corresponding cached value and increment the current index
      if (currentIndex < furthestIndex) return previousValues[++currentIndex];

      // Get the next value from the async iterator
      const result = Object.assign({ index: currentIndex }, await asyncIterator.next());

      // If the result has a value, add it to the cache and increment the current and furthest indices
      if (!result.done) {
        previousValues.push(result);
        currentIndex++;
        furthestIndex++;
      }

      // Return the result
      return result;
    },
    previous: async () => {
      // Decrement the current index and return the corresponding cached value
      return previousValues[--currentIndex];
    }
  };
}