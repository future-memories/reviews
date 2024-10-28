# Future memories Review page

User Display name is `FM` + last 6 chars from user_id uppercased:
`kq8BjU5js0f34tMt63bltwHy1wO2` -> `FMHY1WO2`



- remove "Saved" images, only "Uploaded" are eligible for review
- how many images in total of each status
- comment on reviews
  - how many are task images
- continue working from draft

1. we need to remove saved images on the frontend as querying for
  `where('type', '==', 'Uploaded')` requires an index on the prod database.

<!-- https://firebase.google.com/docs/firestore/manage-data/add-data -->
