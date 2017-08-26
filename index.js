const REDUCER_KEY = 'redux-incremental-history';
const IS_UNDO_REDO_FLAG = 'redux-incremental-history/is-undo-redo';

const UNDO = 'redux-incremental-history/undo';
const REDO = 'redux-incremental-history/redo';

const initialState = {
  undoStack: [],
  redoStack: [],
};

function undo() {
  return { type: UNDO };
}

function redo() {
  return { type: REDO };
}

function selectCanUndo(state) {
  return state[REDUCER_KEY].undoStack.length > 0;
}

function selectCanRedo(state) {
  return state[REDUCER_KEY].redoStack.length > 0;
}

function createReduxIncrementalHistory(inverter) {
  const middleware = store => next => (action) => {
    if (action.type === UNDO) {
      const invertedAction = store.getState()[REDUCER_KEY].undoStack[0];
      invertedAction[IS_UNDO_REDO_FLAG] = true;
      if (invertedAction) {
        store.dispatch(invertedAction);
      }
    } else if (action.type === REDO) {
      const invertedAction = store.getState()[REDUCER_KEY].redoStack[0];
      invertedAction[IS_UNDO_REDO_FLAG] = true;
      if (invertedAction) {
        store.dispatch(invertedAction);
      }
    }
    next(action);
  };

  const reducer = (state = initialState, action) => {
    if (action.type === UNDO) {
      const inverted = inverter(state, state.undoStack[0]);
      return {
        undoStack: state.undoStack.slice(1),
        redoStack: [inverted, ...state.redoStack],
      };
    } else if (action.type === REDO) {
      return {
        redoStack: state.redoStack.slice(1),
        undoStack: [inverter(state, state.redoStack[0]), ...state.undoStack],
      };
    } else if (!action[IS_UNDO_REDO_FLAG]) {
      const inverted = inverter(state, action);
      if (inverted) {
        return {
          undoStack: [inverted, ...state.undoStack],
          redoStack: state.redoStack,
        };
      }
    }

    return state;
  };

  return {
    middleware,
    reducer,
  };
}

export default createReduxIncrementalHistory;
export { undo, redo, selectCanUndo, selectCanRedo, REDUCER_KEY };
