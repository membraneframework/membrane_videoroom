import { useReducer } from "react";

import Stream from "../types/stream";

export function useParticipants() {
  type State = {
    [key: string]: Stream;
  };

  enum ActionType {
    Set,
    Update,
    Remove,
  }

  type Action = {
    type: ActionType;
    participant: string;
    data?: Partial<Stream>;
  };

  const reducer = (state: State, action: Action): State => {
    switch (action.type) {
      case ActionType.Set:
        const stream = action.data as Stream;
        return { ...state, [action.participant]: stream };
      case ActionType.Remove:
        delete state[action.participant];
        return state;
      case ActionType.Update:
        return {
          ...state,
          [action.participant]: {
            ...state[action.participant],
            ...action.data,
          },
        };
      default:
        throw new TypeError("Unhandled action type");
    }
  };

  const initialState: { [key: string]: Stream } = {};
  const [participants, dispatch] = useReducer(reducer, initialState, (a) => a);

  return {
    participants,
    setParticipant: (participant: string, data: Stream) =>
      dispatch({ type: ActionType.Set, participant, data }),
    removeParticipant: (participant: string) =>
      dispatch({ type: ActionType.Remove, participant }),
    updateParticipant: (participant: string, data: Partial<Stream>) =>
      dispatch({ type: ActionType.Update, participant, data }),
  };
}

export default useParticipants;
