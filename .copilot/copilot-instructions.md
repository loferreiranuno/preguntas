Adjusted Requirements for Collaborative Kahoot Replica with PostGres Integration
1. PostGres Setup

Create a PostGres project
Enable PostGres as the real-time database.
Enable PostGres Hosting for deployment.
Enable anonymous authentication to allow participants to join without logging in.

2. Database Structure

Games Collection:
Document ID: PIN (a unique 6-digit number)
Fields:
hostId: UID of the host (string)
state: Game state ('waiting', 'question_submission', 'answering', 'finished')
groups: Array of objects, each with:
name: Group name (string)
participants: Array of participant UIDs (strings)
questionSubmitted: Boolean indicating if the group has submitted their question


questions: Array of objects, each with:
groupName: Name of the group that created the question (string)
text: Question text (string)
options: Array of four answer choices (strings: a, b, c, d)
correct: Index of the correct option (integer: 0, 1, 2, or 3)






Answers Subcollection (under each game):
Document ID: Auto-generated
Fields:
groupName: Name of the group that answered (string)
questionGroupName: Name of the group that created the question (string)
answer: Selected option index (integer: 0, 1, 2, or 3)
time: Time taken to answer in seconds (number)





3. Host Features

Create Game:
Generate a unique 6-digit PIN.
Save the game to Firestore with state set to 'waiting'.


Manage Groups:
View a list of joined groups and their status (e.g., question submitted or not).


Control Game Flow:
Start the question submission phase, updating state to 'question_submission'.
When all groups have submitted their questions, start the answering phase, updating state to 'answering'.
End the game, setting state to 'finished' after all questions are answered.


Real-Time Monitoring:
See groups join and submit questions in real-time.
View answers submitted by groups during the answering phase.


Leaderboard:
Calculate scores: 1 point for each correct answer.
Display group rankings based on total scores.



4. Group Features

Join Game:
Enter the game PIN and select a unique group name.
If the group name is taken, show an error and prompt for a new name.
Add the group to the groups array with anonymous UIDs for participants.


Create Question:
During the question submission phase, create one question with four options (a, b, c, d) and specify the correct answer.
Submit the question to the questions array in the game document.


Answer Questions:
During the answering phase, answer all questions created by other groups.
Submit answers to the answers subcollection.


Leaderboard:
View group scores and rankings at the end of the game.



5. Real-Time Updates

Use Firestore real-time listeners to:
Update the host’s view as groups join, submit questions, and answer questions.
Notify groups of game state changes (e.g., phase transitions) instantly.



6. Security Rules

Games Collection:
Allow read access to all.
Allow updates only if request.auth.uid matches hostId.


Groups Array:
Allow groups to join if the game is in 'waiting' state.
Allow question submission if the game is in 'question_submission' state and the group hasn’t submitted yet.


Answers Subcollection:
Allow creation if:
User is authenticated.
The game is in 'answering' state.
The group hasn’t already answered the question.





7. UI/UX

Framework: Use Vue.js with Vue Router for navigation.
Views:
Landing page: Options to host or join a game.
Host dashboard: Manage game, view group status, control phases, show leaderboard.
Group pages: Join game, create question, answer questions, view leaderboard.


Design: Ensure responsiveness for desktop and mobile devices.
Timer: Optional client-side timer for answering questions.

8. Deployment

Deploy to PostGres 
Verify configurations (Firestore, Hosting, Authentication) are set up correctly.
Test the app to ensure real-time functionality and security rules work as expected.

This setup creates a collaborative Kahoot replica where groups contribute questions and compete by answering, all in real-time with PostGres and Vue.js.


9. Dockerize the projects

Create a docker file per each project and a docker compose to deploy them.