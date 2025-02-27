let $ = (selector) => document.querySelector(selector);
let fm = (userId) => 'FM' + userId.substring(userId.length - 6).toUpperCase();

document.addEventListener('x-memories-ready', () => {
  console.log('[EVENT] x-memories-ready');
  for (let i = 0; i < window.memoryCards.length; i++) {
    window.memoryCards[i].addEventListener('click', () => {
      window.reviewState.index = i;
      update();
    });
  }
  update();

  $('#btn-prev').addEventListener('click', controlPrev);
  $('#btn-skip').addEventListener('click', controlSkip);
  $('#btn-good').addEventListener('click', controlGood);
  $('#btn-bad').addEventListener('click', controlBad);
  $('#btn-extra-bad').addEventListener('click', controlExtraBad);
  $('#btn-task').addEventListener('click', controlTask);
  $('#btn-fail').addEventListener('click', controlFail);
  $('#btn-highlight').addEventListener('click', postToDiscord);
  document.addEventListener('keyup', controlListener);

  $('#review > table .user').innerText = window.reviewState.getMemory().userId;
  let minSeconds = window.memoryData[0].timestamp.seconds, maxSeconds = 0;
  window.memoryData.forEach(data => {
    minSeconds = Math.min(minSeconds, data.timestamp.seconds);
    maxSeconds = Math.max(maxSeconds, data.timestamp.seconds);
  });
  let minDate = new Date(minSeconds * 1000).toISOString();
  let maxDate = new Date(maxSeconds * 1000).toISOString();
  $('#review > table .start').innerText = minDate.split('.')[0].replace('T', ' ');
  $('#review > table .end').innerText = maxDate.split('.')[0].replace('T', ' ');

  // fill status data from existing review if we're doing an edit
  if (window.editReview != null) {
    let statusReverseMap = {
      0: 'pending', // should never exist
      1: 'good',
      2: 'bad',
      3: 'task',
      4: 'fail',
      5: 'extra-bad',
    };
    console.assert(window.editReview.data.length == window.memoryData.length);
    window.editReview.data.forEach(statusId => {
      window.reviewState.setStatus(statusReverseMap[statusId]);
      window.reviewState.moveIndexBy(1);
    });
    $("#comment").value = window.editReview.comment;
    update();
  }
});

let controlListener = (event) => {
  if (document.activeElement === $('#comment')) return;
  // console.log('DBG: Key pressed: ', event);
  switch (event.key) {
    case 'ArrowLeft': controlPrev(); break;
    case 'ArrowRight': controlSkip(); break;
    case 'a': controlGood(); break;
    case 's': controlBad(); break;
    case 'd': controlTask(); break;
    case 'f': controlFail(); break;
    case 'x': controlExtraBad(); break;
    default: break;
  }
}

let controlSkip = () => { window.reviewState.moveIndexBy(1); update(); }
let controlPrev = () => { window.reviewState.moveIndexBy(-1); update(); }
let controlGood = () => { window.reviewState.setStatus("good"); window.reviewState.moveIndexBy(1); update(); }
let controlBad = () => { window.reviewState.setStatus("bad"); window.reviewState.moveIndexBy(1); update(); }
let controlExtraBad = () => { window.reviewState.setStatus("extra-bad"); window.reviewState.moveIndexBy(1); update(); }
let controlTask = () => { window.reviewState.setStatus("task"); window.reviewState.moveIndexBy(1); update(); }
let controlFail = () => { window.reviewState.setStatus("fail"); window.reviewState.moveIndexBy(1); update(); }
let postToDiscord = () => {
  // make a post request to the discord API to publish a message
  let data = window.reviewState.getMemory();
  fetch(`https://fm.mitiko.xyz/discord`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: `Highlighted memory from ${fm(data.userId)} in ${data.country}`,
      embeds: [{
        "title": `Memory #${data.imageId}`,
        "description": `Location: ${data.city}, ${data.country}`,
        "image": { "url": `https://xiw.io/cdn-cgi/image/width=400,quality=95/${data.imageUrl}` },
        "fields": [
          { "name": "User", "value": data.userId, "inline": true },
          { "name": "Date", "value": new Date(data.timestamp.seconds * 1000).toISOString().split('.')[0].replace('T', ' '), "inline": true },
          { "name": "Tags", "value": data.tags.map(tag => tag.keyword.toLowerCase()).join(', ') },
        ],
      }],
    }),
  }).then(response => {
    if (response.ok) {
      alert('[INFO] Successfully posted to Discord');
    } else {
      alert('[ERROR] Failed to post to Discord');
    }
  });
};

let update = () => {
  $('#review > table .progress').innerText = `${window.reviewState.reviewed} / ${window.reviewState.total} reviewed (${window.reviewState.getPercentageReviewed()}%)`;

  // if 100%, show the submit review button
  if (window.reviewState.reviewed == window.reviewState.total) {
    $('#review > form > button[type="submit"]').disabled = false;
  }
  // if review is submitted, show print button (or enable it)
  if (window.reviewState.submitted) {
    $('#review > form > button[type="submit"]').disabled = true;
    $('button#btn-print').disabled = false;
  }

  updateCurrentMemory();
};

let updateCurrentMemory = () => {
  let data = window.reviewState.getMemory();
  let status = window.reviewState.getStatus();

  $('#current-memory img').src = `https://xiw.io/cdn-cgi/image/width=400,quality=95/${data.imageUrl}`;
  $('#current-memory img').className = status;
  $('#memory-id').innerText = data.imageId;

  let fullDate = new Date(data.timestamp.seconds * 1000).toISOString();
  $('#status .time').innerText = fullDate.split('.')[0].replace('T', ' ');
  $('#status .status').innerText = `[i = ${window.reviewState.index}] ${status}`;
  $('#status .location').innerText = `${data.city}, ${data.country}`;

  for (let i = 0; i < 3 && i < data.tags.length; i++) {
    $(`#status .tag${i + 1} > th`).innerText = `[w = ${data.tags[i].weight}]`;
    $(`#status .tag${i + 1} > td`).innerText = data.tags[i].keyword.toLowerCase();
  }
  for (let i = data.tags.length; i < 3; i++) {
    $(`#status .tag${i + 1} > th`).innerText = "[w = ?]";
    $(`#status .tag${i + 1} > td`).innerText = "N/A";
  }
}
