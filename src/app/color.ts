import {sha256} from 'js-sha256'


// h:0-6 s:0-1 v:0-1
function hsvToColor(h: number, s: number, v: number) {
  let c = v * s
  let x = s * (1 - (h % 2 - 2));
  let r = v - c, g = v - c, b = v - c;
  if (h <= 1) {
      r+=c;
      g+=x;
  } else if (h <= 2) {
      r+=x;
      g+=c;
  } else if (h <= 3) {
      g+=c;
      b+=x;
  } else if (h <= 4) {
      g+=c;
      b+=s;
  } else if (v <= 5) {
      r+=x;
      b+=c;
  } else {
      r+=c;
      b+=x;
  }
  let hex = (i:number) => ('00' + Math.round(i * 256).toString(16)).substr(-2);
  return '#' + hex(r) + hex(g) + hex(b);
}

export function strToColor(seed:string, name:string) {
  let al = sha256.array(`sha__${seed}__${name}`);
  return hsvToColor(
      (al[0] * 256 + al[1]) / 65536 * 6,
      (al[2] / 256) * 0.5 + 0.5,
      (al[3] / 256) * 0.2 + 0.3
  );
}
