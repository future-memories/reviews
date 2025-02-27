import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, limit, getDocs, getDoc, doc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

let $ = (selector) => document.querySelector(selector);

const fmDB = getFirestore(initializeApp({
  projectId: "patr-3a75e",
  appId: "1:1067533396497:web:6570ade6f7fda6df8f1fb0",
  apiKey: "AIzaSyAas9R4-9q4Tyrv4LDQx1falWjmco_P4LE",
  authDomain: "patr-3a75e.firebaseapp.com",
  storageBucket: "patr-3a75e.appspot.com",
  messagingSenderId: "1067533396497",
  measurementId: "G-Y2ZJ3SMS32"
}, "fm"));

const reviewDB = getFirestore(initializeApp({
  projectId: "id-fm-reviews",
  appId: "1:139765414634:web:34544f92eeb915b3f27593",
  apiKey: "AIzaSyCSaGPsgk4PiNAL2bp0h_lq6VDBdOFdAWM",
  authDomain: "id-fm-reviews.firebaseapp.com",
  storageBucket: "id-fm-reviews.appspot.com",
  messagingSenderId: "139765414634",
  measurementId: "G-DN5NWXVX7N"
}, "fm-reviews"));

let parseUserId = (input) => {
  input = input.trim();
  let urlRe = new RegExp("^https:\/\/explorer\.futurememory\.app\/user\/(?<userId>[a-zA-Z0-9]{28})\/?$");
  let idRe = new RegExp("^(?<userId>[a-zA-Z0-9]{28})\/?$");

  let res = input.match(urlRe) ?? input.match(idRe);
  return res?.groups?.userId ?? null;
};

let parseMemoryId = (input) => {
  input = input.trim();
  let urlRe = new RegExp("^https:\/\/explorer\.futurememory\.app\/memory\/(?<memoryId>[a-zA-Z0-9]{20})");
  let idRe = new RegExp("^(?<memoryId>[a-zA-Z0-9]{20})$");

  let res = input.match(urlRe) ?? input.match(idRe);
  return res?.groups?.memoryId ?? null;
};

let getLastReviewTime = async (userId) => {
  try {
    // we only need the document IDs, but Firestore doesn't allow us to just fetch the IDs
    // or maybe it does, but I don't know how to do it & ChatGPT hallucinates a `select()` method
    // TODO: fix this if it eveer becomes too slow
    let q = query(
      collection(reviewDB, 'reviews'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
    );

    // order document IDs by the last image timestamp (part of the id)
    let querySnapshot = await getDocs(q);
    let documentIds = querySnapshot.docs.map(doc => doc.id).sort((a, b) => {
      let aSeconds = a.split('-').pop();
      let bSeconds = b.split('-').pop();
      return Number(bSeconds) - Number(aSeconds);
    });
    if (documentIds.length == 0) {
      // shitty error handling system, should revise
      throw new Error(`[W]No reviews found for user "${userId}"`);
    } else {
      console.log(`Found ${documentIds.length} reviews for user "${userId}"`);
    }

    let lastReviewId = documentIds[0];
    let lastReview = (await getDoc(doc(reviewDB, "reviews", lastReviewId))).data();

    if (lastReview.hasOwnProperty("imageIds")) {
      console.log(`Last review ${lastReviewId} is v2 and has property imageIds, fetching last memory...`);
      // images are ordered by timestamp descending, so the first one in the list is the latest
      let lastReviewedImageId = lastReview.imageIds[0];
      console.log(`Last memory ID: ${lastReviewedImageId}`);
      let lastMemory = await getMemory(lastReviewedImageId);
      return lastMemory.uploaded_at;
    }
    // if the review doesn't have an imageIds field, it's a legacy review
    // we can just return 1 seconds past the last review, based on the reviewId
    // small chance we skip some image(s) if submitted offline
    let lastSecond = Number(lastReviewId.split('-').pop()) + 1;
    console.log(`Last review ${lastReviewId} is v1 and does not have property imageIds. Starting review from ${lastSecond}`);
    return {seconds: lastSecond, nanoseconds: 0};
  } catch (error) {
    let isWarning = error.message.startsWith("[W]");
    let message = isWarning ? error.message.substring(3) : error.message;
    (isWarning ? console.warn : console.error)(`X-Error[getLastReviewTime]: ${message}`);
    return null;
  }
};

let getMemory = async (memoryId) => {
  try {
    let ref = doc(fmDB, "images", memoryId);
    let snapshot = await getDoc(ref);
    if (snapshot.exists()) {
        console.log("Memory found", snapshot.data());
        return snapshot.data();
    } else {
      console.error(`Memory not found. memoryId = "${memoryId}"`);
      return null;
    }
  } catch (error) {
    console.error(`X-Error[getMemory]: ${error}`);
    return null;
  }
};

let onSubmit = async (e) => {
  e.preventDefault(); // prevent default form behavior
  let quit = (msg) => { alert(msg); return false };
  let redirect = (userId, timestamp, exclusive = false) => window.location.href = `review.html?userId=${userId}&since=${timestamp.seconds}&ns=${timestamp.nanoseconds}` + (exclusive ? "&exclusive=true" : "");

  let userId = parseUserId($("#user").value);
  if (userId == null) return quit("Invalid user ID");

  let lastReviewEnd = await getLastReviewTime(userId);
  if (lastReviewEnd != null) return redirect(userId, lastReviewEnd, true);

  let inputLastMemory = $("#last-memory").value;
  if (inputLastMemory == "") {
    $('#last-memory').style.display = 'block';
    return quit("No reviews found for this user. Please input last non-reviewed memory (as URL or ID) and resubmit.");
  }

  if (inputLastMemory == "ALL") return redirect(userId, {seconds: 0, nanoseconds: 0});

  let memoryId = parseMemoryId(inputLastMemory);
  if (memoryId == null) return quit("Invalid memory ID");

  let lastMemory = await getMemory(memoryId);
  if (lastMemory == null) return quit("Memory not found");
  // Images, unlike memories, don;t have the type field and are assumed to be uploaded.
  // We can skip the check alltogether I guess.. Or only check if it does have the type field
  // if (lastMemory.type != "Uploaded") return quit("Memory is not of type 'Uploaded'");
  if ((lastMemory.creatorId ?? lastMemory.uploader_id) != userId)
    return quit("Memory does not belong to the user");

  return redirect(userId, lastMemory.timestamp ?? lastMemory.uploaded_at);
};

document.addEventListener("DOMContentLoaded", (_event) => {
  $("#review-request-form").addEventListener("submit", onSubmit);
});

let tests = () => {
  console.assert(parseUserId("random") === null, "Test 1 failed");
  console.assert(parseUserId("https://explorer.futurememory.app/user/71nxIAj6SKeYBBTv7wiKYh03ap62") === "71nxIAj6SKeYBBTv7wiKYh03ap62", "Test 2 failed");
  console.assert(parseUserId("https://explorer.futurememory.app/user/71nxIAj6SKeYBBTv7wiKYh03ap62/") === "71nxIAj6SKeYBBTv7wiKYh03ap62", "Test 3 failed");
  console.assert(parseUserId("  https://explorer.futurememory.app/user/71nxIAj6SKeYBBTv7wiKYh03ap62/  ") === "71nxIAj6SKeYBBTv7wiKYh03ap62", "Test 4 failed");
  console.assert(parseUserId("cgEEM9ZNv1etWS3CYkZUiiSHEMl1") === "cgEEM9ZNv1etWS3CYkZUiiSHEMl1", "Test 5 failed");
  console.assert(parseUserId("  cgEEM9ZNv1etWS3CYkZUiiSHEMl1/") === "cgEEM9ZNv1etWS3CYkZUiiSHEMl1", "Test 6 failed");
  console.assert(parseMemoryId("https://explorer.futurememory.app/memory/uMaImW1aDuroALTgIOBU/associations") === "uMaImW1aDuroALTgIOBU", "Test 7 failed");
  console.assert(parseMemoryId("uMaImW1aDuroALTgIOBU") === "uMaImW1aDuroALTgIOBU", "Test 8 failed");
  console.assert(parseMemoryId("uMaImW1aDuroALTgIOBU  ") === "uMaImW1aDuroALTgIOBU", "Test 9 failed");
};
tests();
