const DOMAIN = "motoko-playground";

export function pow(timestamp: bigint) {
  console.time("PoW");
  let nonce = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
  const prefix = DOMAIN + timestamp;
  while (true) {
    const hash = motokoHash(prefix + nonce);
    if (hashOk(hash)) {
      break;
    }
    nonce += BigInt(1);
  }
  console.timeEnd("PoW");
  return {
    timestamp,
    nonce,
  };
}

function motokoHash(message: string): number {
  const base = 2 ** 32;
  var x = 5381;
  for (let i = 0; i < message.length; i++) {
    const c = message.charCodeAt(i);
    x = ((((x << 5) + x) % base) + c) % base;
  }
  return x;
}

function hashOk(hash: number): boolean {
  return (hash & 0xc0000000) === 0;
}
