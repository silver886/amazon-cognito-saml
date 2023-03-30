import type {FlowResult} from 'samlify/types/src/flow';

export interface State {
   serviceProviderId: string;
   loginRequest: FlowResult;
   ssoService: {
      binding: string;
      location: string;
   };
   requestId: string;
   relayState: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isState(obj: any): obj is State {
   const state = obj as State;
   return (
      'serviceProviderId' in state &&
      'loginRequest' in state &&
      'ssoService' in state &&
      'binding' in state.ssoService &&
      'location' in state.ssoService &&
      'requestId' in state &&
      'relayState' in state
   );
}
