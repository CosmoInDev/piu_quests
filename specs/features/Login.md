# Sign up and log in

This document states the user management specification.

---

## 0. Terms

- One important thing: we do not use term **Sign** here.
  - sign in, sign up, sign out, ... For a person who uses English as second language, this is really frustrating.
- We use:
  - Register (회원가입)
  - Log in (로그인)
  - Log out (로그아웃)
  - Delete account (회원탈퇴)

## 1. 'Log in' button

- We show the button labeled '로그인' at the top right side of page.
  - for mobile view, at the bottom of sidebar.
  - Make a real button that would look different than other boards. It should have a border and different background color that distinguishes it.
  - adding a 'log in' symbol left to '로그인' label would be great, just like current logout button.
- When button is clicked, a modal appears and gives 1 social login choice with button
  - google: use same API that is already implemented.
  - For now only google is available.
- When the user used social login and it is the new user, do this process:
  - A modal ask for the user name. Provide default value as the user's name that OAuth2 authentication returned.
  - Modal has:
    - '사용자명을 입력해주세요.' text above
    - Under the text, input form that receives user name. (default value provided)
    - Under the form, '취소' cancel button and '확인' submit button.
  - when clicked '확인', backend server checks for name duplication and saves the user information.
    - For the further use, user name should not be duplicated.
    - If name is duplicated, backend API would send that the save failed because of name duplication.
      - alert message would appear to user.
    - User is registered only if the name is successfully verified. Never save new user data before verification.
  - when clicked '취소', modal is closed. User is not registered, and no data are saved.
- When the user is successfully logged in, there is user's name and logout button at the prior login button's place.
  - User name works like a button, with same UI as the board '오늘의 숙제': this leads to user settings page.
  - On the right side of user name, a 'setting' icon would be good for users to be identified there is user settings page button.

## 2. User settings page

- At this page, there are 2 features.
- First, user can modify their name.
  - There is name input form and '확인' submit button.
  - When submitted, name is saved if not duplicated.
  - if duplicated, it fails and the alert message goes to user.
  - If succeeds, shows alert message "이름이 변경되었습니다." and refreshes page when clicked '확인'.
- Second, user can delete their account.
  - If account is deleted, confirm message is appeared to user.
```
정말 탈퇴하시겠습니까?
탈퇴 시 회원 정보는 사라지지만, 업로드한 기록은 사라지지 않습니다.
```
  - if the user confirmed, user is logged out and user information is deleted from DB.
