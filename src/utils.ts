// Just an identity function, but can be used to check whether a literal object
// has the exact type required.
export function check<T>(object: T): T {
    return object;
}