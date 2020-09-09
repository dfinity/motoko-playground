import playground from 'ic:canisters/playground';

playground.greet(window.prompt("Enter your name:")).then(greeting => {
  window.alert(greeting);
});
