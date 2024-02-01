import util from 'util';

export function logObject(prefix: string, obj: any) {
    const fullObj = util.inspect(obj, { showHidden: false, depth: null, colors: true });
    console.log(prefix, fullObj)
}
