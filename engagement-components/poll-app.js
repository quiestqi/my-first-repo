document.addEventListener('DOMContentLoaded', function () {
  const firebaseConfig = {
    apiKey: "AIzaSyCU8LGZF8jAMVP2-QLL8kHcDI2GOCJPBHk",
    authDomain: "cdw-engagement.firebaseapp.com",
    databaseURL: "https://cdw-engagement-default-rtdb.firebaseio.com",
    projectId: "cdw-engagement",
    storageBucket: "cdw-engagement.firebasestorage.app",
    messagingSenderId: "1040694228905",
    appId: "1:1040694228905:web:ccb024b7befceae1d8f6b8",
    measurementId: "G-0H3NE6S1RB"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const database = firebase.database();
  const pollRef = database.ref('leastObservedPoll');
  const options = ['park', 'library', 'museum', 'subway', 'street', 'nowhere'];
  const buttons = Array.from(document.querySelectorAll('.vote-btn'));
  const totalVotesElement = document.getElementById('total-votes');
  const voteMessage = document.getElementById('vote-message');
  const connectionStatus = document.getElementById('connection-status');

  function renderPoll(data) {
    let total = 0;

    options.forEach(function (option) {
      const count = Number(data[option]) || 0;
      const countElement = document.getElementById(option + '-count');
      countElement.textContent = count;
      total += count;
    });

    totalVotesElement.textContent = total;
  }

  pollRef.on('value', function (snapshot) {
    renderPoll(snapshot.val() || {});
  }, function (error) {
    console.error('Unable to read poll data:', error);
    voteMessage.textContent = 'Unable to load results.';
  });

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      const option = button.dataset.option;
      const optionRef = pollRef.child(option);

      buttons.forEach(function (item) { item.disabled = true; });
      voteMessage.textContent = 'Recording response...';

      optionRef.transaction(function (currentValue) {
        return (Number(currentValue) || 0) + 1;
      }).then(function (result) {
        if (!result.committed) {
          throw new Error('Vote was not committed.');
        }

        button.classList.add('selected');
        voteMessage.textContent = 'Response recorded: ' + button.querySelector('.vote-text').textContent + '.';

        window.setTimeout(function () {
          button.classList.remove('selected');
        }, 1200);
      }).catch(function (error) {
        console.error('Unable to record response:', error);
        voteMessage.textContent = 'Could not record the response. Please try again.';
      }).finally(function () {
        buttons.forEach(function (item) { item.disabled = false; });
      });
    });
  });

  database.ref('.info/connected').on('value', function (snapshot) {
    const connected = snapshot.val() === true;
    connectionStatus.classList.toggle('connected', connected);
    connectionStatus.classList.toggle('disconnected', !connected);
    connectionStatus.lastElementChild.textContent = connected
      ? 'Connected to Firebase'
      : 'Disconnected from Firebase';
  });
});
