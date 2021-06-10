# Getting Started with Your Own Internet Computer React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `yarn deploy`

Spins up the `dfx` server and creates a local deployment by building a production bundle and installing it on the local UI canister.\
Open [http://localhost:8000/?canisterId=ryjl3-tyaaa-aaaaa-aaaba-cai](http://localhost:8000/?canisterId=ryjl3-tyaaa-aaaaa-aaaba-cai) to view the local canister in your browser.

### `yarn start`

Starts the `dfx` server in the background and runs the app in development mode.

> :warning:<span>&nbsp;&nbsp;</span> **Note:** If it's your first time running the app, or you've made any changes to the backend canister code, you'll need to run `yarn deploy` before this command to populate the `.dfx` directory correctly.

Open [http://localhost:3000/?canisterId=ryjl3-tyaaa-aaaaa-aaaba-cai](http://localhost:3000/?canisterId=ryjl3-tyaaa-aaaaa-aaaba-cai) to view it in the browser.

The page will update if you make edits.\
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in minimized production mode and optimizes the build for the best performance.\

### `yarn deploy -- --network ic`

Sends your minified, production built app to the Internet Computer to live in a real canister on the network! The command returns the canisterId of the newly deployed app ("react-app")

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
