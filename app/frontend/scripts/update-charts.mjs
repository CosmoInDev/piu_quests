// mentormin.com 의 채보 데이터를 긁어 src/data/charts.json 을 갱신한다.
//
//   node scripts/update-charts.mjs   (= npm run update:charts)
//
// mentormin 홈페이지는 단일 HTML 안에 전체 채보 배열(ALL_CHARTS)을 인라인으로 담고 있다.
//   ALL_CHARTS = [ [곡명(한글), 곡명(영문), 아티스트, 싱글 레벨[], 더블 레벨[], 코옵[], 버전, ?], ... ]
// 이 배열은 그대로 유효한 JSON 이라 잘라내서 JSON.parse 하면 된다.
// 곡 종류(아케이드/숏컷/리믹스/풀송)는 mentormin 과 동일하게 곡명으로 판정하고,
// '리믹스'가 곡명에 없는 리믹스 채널 곡 목록(REMIX_EXTRA)도 같은 페이지에서 함께 가져온다.
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SOURCE_URL = "https://mentormin.com/";
const OUT_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "data",
  "charts.json"
);

// 데이터가 깨졌을 때 조용히 반쪽짜리 파일을 쓰지 않도록 하는 최소 기준.
const MIN_SONGS = 600;
const MIN_REMIX_EXTRA = 20;

function slice(html, startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  if (start < 0) throw new Error(`${startMarker} 를 찾지 못했습니다.`);
  const from = start + startMarker.length;
  const end = html.indexOf(endMarker, from);
  if (end < 0) throw new Error(`${startMarker} 의 끝을 찾지 못했습니다.`);
  return html.slice(from, end + endMarker.length);
}

function parseAllCharts(html) {
  const literal = slice(html, "const ALL_CHARTS=", "\n];");
  return JSON.parse(literal.slice(0, literal.lastIndexOf("]") + 1));
}

// new Set(['가','나',...]) 형태의 JS 리터럴 → 문자열 배열.
function parseRemixExtra(html) {
  const literal = slice(html, "const REMIX_EXTRA=new Set(", "]);");
  const json = literal.slice(literal.indexOf("["), literal.indexOf("]") + 1);
  return JSON.parse(json.replaceAll("'", '"'));
}

function categoryOf(name, remixExtra) {
  if (name.includes("SHORT CUT")) return "shortcut";
  if (name.includes("FULL SONG")) return "fullsong";
  if (name.includes("리믹스") || remixExtra.has(name)) return "remix";
  return "arcade";
}

const res = await fetch(SOURCE_URL);
if (!res.ok) throw new Error(`${SOURCE_URL} 응답 ${res.status}`);
const html = await res.text();

const allCharts = parseAllCharts(html);
const remixExtra = new Set(parseRemixExtra(html));

if (allCharts.length < MIN_SONGS) {
  throw new Error(`곡 수가 ${allCharts.length}개뿐입니다. 페이지 구조가 바뀐 것 같습니다.`);
}
if (remixExtra.size < MIN_REMIX_EXTRA) {
  throw new Error(`REMIX_EXTRA 가 ${remixExtra.size}개뿐입니다. 페이지 구조가 바뀐 것 같습니다.`);
}

// 코옵(6번째)·버전(7번째)은 추첨에 쓰지 않으므로 버린다.
const songs = allCharts
  .map(([name, , , single, double]) => ({
    name: name.trim(),
    category: categoryOf(name, remixExtra),
    single,
    double,
  }))
  .sort((a, b) => a.name.localeCompare(b.name, "ko"));

await writeFile(
  OUT_PATH,
  JSON.stringify({ source: SOURCE_URL, songs }, null, 0) + "\n"
);

const counts = {};
for (const s of songs) counts[s.category] = (counts[s.category] ?? 0) + 1;
console.log(`${songs.length}곡 저장: ${OUT_PATH}`);
console.log("종류별:", counts);
