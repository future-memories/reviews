# Future memories Review page

User Display name is `FM` + last 6 chars from user_id uppercased:
`kq8BjU5js0f34tMt63bltwHy1wO2` -> `FMHY1WO2`

docs: https://firebase.google.com/docs/firestore/manage-data/add-data

### TODO - reviews

- [X] continue working from draft
- [ ] request for review
- [ ] terraform for firebase
- [ ] check if user is authorized
- [ ] single module file for common operations, functions &

### TODO - analytics

- [ ] cell manager page -> one per country, memory count since last review (highlight if more than 200)
- [ ] monthly report -> url `type` param, same `date` param (extract the date, split by dash)
- [ ] onSnapshot() live updates for daily report ???
- [ ] move to new firebase project (but maybe we want the terraform here now)
- [ ] UI/UX
  - [ ] usernames should be links (clickable)
  - [ ] countries should be clickable -> go to cell manager's page
  - [ ] periods for 1 week, 1 month, 3 months
