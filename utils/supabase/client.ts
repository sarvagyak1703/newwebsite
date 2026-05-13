type Result = { data: any; error: null };

const empty: Result = { data: [], error: null };
const nullResult: Result = { data: null, error: null };

function queryBuilder() {
  const builder: any = {
    select: () => builder,
    insert: () => Promise.resolve(empty),
    update: () => Promise.resolve(empty),
    delete: () => Promise.resolve(empty),
    eq: () => Promise.resolve(empty),
    single: () => Promise.resolve(nullResult),
    then: (resolve: (v: Result) => unknown) => Promise.resolve(empty).then(resolve),
  };
  return builder;
}

function rpcCall() {
  const promise: any = Promise.resolve(empty);
  promise.single = () => Promise.resolve(nullResult);
  return promise;
}

export function createClient() {
  return {
    from: () => queryBuilder(),
    rpc: () => rpcCall(),
  };
}
