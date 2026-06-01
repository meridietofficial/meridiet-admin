import { combineReducers } from "redux";

const appReducer = combineReducers({
  app: (state = {}) => state,
});

const rootReducer = (state, action) => {
  if (action.type === "LOGOUT") {
    state = undefined;
  }
  return appReducer(state, action);
};

export default rootReducer;
