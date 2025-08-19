// Basic setup test to ensure Jest is working
describe('Backend Test Setup', () => {
  it('should have Node.js environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should have access to basic JavaScript features', () => {
    const testArray = [1, 2, 3];
    const doubled = testArray.map(x => x * 2);
    expect(doubled).toEqual([2, 4, 6]);
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve('test');
    const result = await promise;
    expect(result).toBe('test');
  });

  it('should handle date operations', () => {
    const now = new Date();
    expect(now).toBeInstanceOf(Date);
    expect(typeof now.getTime()).toBe('number');
  });

  it('should handle JSON operations', () => {
    const obj = { test: 'value', number: 42 };
    const json = JSON.stringify(obj);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual(obj);
  });
});