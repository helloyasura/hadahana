import {
  buildLearningSnapshot,
  loadFeedbackStore,
  netScore,
  recordFeedback,
} from "../src/lib/names/feedback-store";
import { pairFallbackNames } from "../src/lib/names/name-pipeline";
import {
  applyLearningToNames,
  reshuffleNamePart,
} from "../src/lib/names/reshuffle";

process.env.NAME_FEEDBACK_DB_PATH =
  process.env.NAME_FEEDBACK_DB_PATH ||
  "/tmp/handahana-name-feedback-verify.json";

async function main() {
  await recordFeedback({
    action: "down",
    target: "first",
    firstRoman: "Joshith",
    firstSinhala: "ජොෂිත්",
    middleRoman: "Dinesh",
    middleSinhala: "දිනේෂ්",
    sessionId: "t1",
  });
  await recordFeedback({
    action: "down",
    target: "first",
    firstRoman: "Joshith",
    firstSinhala: "ජොෂිත්",
    middleRoman: "Dinesh",
    middleSinhala: "දිනේෂ්",
    sessionId: "t1",
  });
  await recordFeedback({
    action: "up",
    target: "first",
    firstRoman: "Mohan",
    firstSinhala: "මොහාන්",
    middleRoman: "Rangana",
    middleSinhala: "රංගන",
    sessionId: "t1",
  });
  await recordFeedback({
    action: "up",
    target: "first",
    firstRoman: "Mohan",
    firstSinhala: "මොහාන්",
    middleRoman: "Rangana",
    middleSinhala: "රංගන",
    sessionId: "t1",
  });
  await recordFeedback({
    action: "up",
    target: "first",
    firstRoman: "Mohan",
    firstSinhala: "මොහාන්",
    middleRoman: "Rangana",
    middleSinhala: "රංගන",
    sessionId: "t1",
  });

  const learning = await buildLearningSnapshot();
  const pool = pairFallbackNames(
    ["ම", "මො", "ජ"],
    ["ර", "ද"],
    "මො",
    "male",
    12,
    "athurudaya",
    "lk",
    "chart",
  );
  const current = {
    ...pool[0],
    first: {
      ...pool[0].first,
      roman: "Joshith",
      sinhala: "ජොෂිත්",
    },
  };
  const next = reshuffleNamePart({
    current,
    part: "first",
    pool,
    firstLetters: ["ම", "මො", "ජ"],
    middleLetters: ["ර", "ද"],
    primary: "මො",
    gender: "male",
    country: "lk",
    letterSource: "chart",
    learning,
  });
  if (!next) throw new Error("reshuffle returned null");
  if (next.first.roman.toLowerCase() === "joshith") {
    throw new Error("reshuffle kept disliked first name");
  }

  const ranked = applyLearningToNames(
    [
      ...pool,
      {
        ...pool[0],
        first: { ...pool[0].first, roman: "Mohan", sinhala: "මොහාන්" },
        roman: `Mohan ${pool[0].middle.roman}`,
        sinhala: `මොහාන් ${pool[0].middle.sinhala}`,
      },
    ],
    learning,
  );

  const store = await loadFeedbackStore();
  const mohan = Object.values(store.parts).find(
    (p) => p.roman.toLowerCase() === "mohan",
  );
  const josh = Object.values(store.parts).find(
    (p) => p.roman.toLowerCase() === "joshith",
  );
  if (!mohan || mohan.upCount < 3) throw new Error("mohan uprate missing");
  if (!josh || josh.downCount < 2) throw new Error("joshith downrate missing");

  console.log(
    JSON.stringify(
      {
        ok: true,
        likedFirst: learning.likedFirst,
        dislikedFirst: learning.dislikedFirst,
        mohan: { up: mohan.upCount, down: mohan.downCount, net: netScore(mohan) },
        josh: { up: josh.upCount, down: josh.downCount, net: netScore(josh) },
        reshuffled: {
          from: "Joshith",
          to: next.first.roman,
          middle: next.middle.roman,
        },
        topAfterLearn: ranked.slice(0, 3).map((n) => `${n.roman}@${n.score}`),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
