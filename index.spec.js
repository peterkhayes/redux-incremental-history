import expect from 'expect';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import createReduxIncrementalHistory, {
  undo, redo, selectCanUndo, selectCanRedo, REDUCER_KEY as INCREMENTAL_HISTORY_STATE_KEY,
} from '.';

const COUNTER_STATE_KEY = 'counter';
const INCREMENT = 'increment';
const DECREMENT = 'decrement';

function increment(amt) {
  return { type: INCREMENT, payload: amt };
}

function decrement(amt) {
  return { type: DECREMENT, payload: amt };
}

function selectCounterValue(state) {
  return state[COUNTER_STATE_KEY];
}

function counterReducer(state = 0, action) {
  if (action.type === INCREMENT) {
    return state + action.payload;
  } else if (action.type === DECREMENT) {
    return state - action.payload;
  }
  return state;
}

function inverter(state, action) {
  if (action.type === INCREMENT) {
    return decrement(action.payload);
  } else if (action.type === DECREMENT) {
    return increment(action.payload);
  }
  return undefined;
}

const {
  reducer: incrementalHistoryReducer,
  middleware: incrementalHistoryMiddleware,
} = createReduxIncrementalHistory(inverter);

const reducer = combineReducers({
  [COUNTER_STATE_KEY]: counterReducer,
  [INCREMENTAL_HISTORY_STATE_KEY]: incrementalHistoryReducer,
});

const middleware = applyMiddleware(incrementalHistoryMiddleware);

describe('Redux Incremental History', () => {
  beforeEach(() => {
    this.store = createStore(reducer, middleware);
  });

  const bindSelector = selector => () => selector(this.store.getState());
  const getCounterValue = bindSelector(selectCounterValue);
  const getCanUndo = bindSelector(selectCanUndo);
  const getCanRedo = bindSelector(selectCanRedo);

  it('works', () => {
    expect(getCanUndo()).toBe(false);
    expect(getCanRedo()).toBe(false);

    this.store.dispatch(increment(1));
    expect(getCounterValue()).toBe(1);
    expect(getCanUndo()).toBe(true);
    expect(getCanRedo()).toBe(false);

    this.store.dispatch(increment(3));
    expect(getCounterValue()).toBe(4);
    expect(getCanUndo()).toBe(true);
    expect(getCanRedo()).toBe(false);

    this.store.dispatch(undo());
    expect(getCounterValue()).toBe(1);
    expect(getCanUndo()).toBe(true);
    expect(getCanRedo()).toBe(true);

    this.store.dispatch(redo());
    expect(getCounterValue()).toBe(4);
    expect(getCanUndo()).toBe(true);
    expect(getCanRedo()).toBe(false);

    this.store.dispatch(undo());
    expect(getCounterValue()).toBe(1);
    expect(getCanUndo()).toBe(true);
    expect(getCanRedo()).toBe(true);

    this.store.dispatch(undo());
    expect(getCounterValue()).toBe(0);
    expect(getCanUndo()).toBe(false);
    expect(getCanRedo()).toBe(true);
  });
});
