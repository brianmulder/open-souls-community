
import { MentalProcess, createCognitiveStep, useActions, createAction } from "@opensouls/local-engine";

const golem: MentalProcess = async ({ workingMemory }) => {
  const { act } = useActions()
  const [withDialog, text] = await createCognitiveStep((instruction: string) => {
    return { command: instruction }
  })(workingMemory,"");
  act(createAction('utterance', text));
  return withDialog;
}

export default golem
