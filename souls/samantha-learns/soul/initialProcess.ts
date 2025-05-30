
import { MentalProcess, useActions } from "@opensouls/local-engine";
import externalDialog from "./cognitiveSteps/externalDialog.js";

/* This is a simple mental process that generates a line of dialog, speaks the dialog, then 
returns a new working memory having remembered they spoke the line of dialog */
const speaks: MentalProcess = async ({ workingMemory }) => {
  const { speak  } = useActions()

  const [withDialog, stream] = await externalDialog(
    workingMemory, "Talk to the user trying to gain trust and learn about their inner world.", { stream: true, model: "gpt-4-0125-preview" }
  );
  speak(stream);

  return withDialog;
}

export default speaks
