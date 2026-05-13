type Result = { data: any; error: null };

const empty: Result = { data: [], error: null };
const nullResult: Result = { data: null, error: null };

function queryBuilder() {
  const builder: any = {
    select: (..._args: any[]) => builder,
    insert: (..._args: any[]) => Promise.resolve(empty),
    update: (..._args: any[]) => Promise.resolve(empty),
    delete: (..._args: any[]) => Promise.resolve(empty),
    eq: (..._args: any[]) => Promise.resolve(empty),
    single: () => Promise.resolve(nullResult),
    then: (resolve: (v: Result) => unknown) =>
      Promise.resolve(empty).then(resolve),
  };
  return builder;
}

function rpcCall() {
  const promise: any = Promise.resolve(empty);
  promise.single = () => Promise.resolve(nullResult);
  return promise;
}

export function createClient(): any {
  return {
    from: (..._args: any[]) => queryBuilder(),
    rpc: (..._args: any[]) => rpcCall(),
  };
}
