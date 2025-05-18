import { MentalProcess, useActions, usePerceptions, useProcessMemory, useProcessManager } from "@opensouls/local-engine";
import externalDialog from "./cognitiveSteps/externalDialog.js";

const interact: MentalProcess = async ({ workingMemory }) => {
  const { speak, scheduleEvent, log, expire } = useActions();
  const { invokingPerception } = usePerceptions();
  const { invocationCount } = useProcessManager();
  const counter = useProcessMemory(0);

  if (invocationCount === 0) {
    scheduleEvent({
      in: 5,
      process: interact,
      perception: {
        action: "reminder",
        content: "ping",
        name: workingMemory.soulName,
      },
    });
    const [next, stream] = await externalDialog(
      workingMemory,
      "Introduce yourself as FeatureTester and mention a reminder will arrive soon.",
      { stream: true }
    );
    speak(stream);
    return next;
  }

  if (invokingPerception?.action === "reminder") {
    const [next, stream] = await externalDialog(
      workingMemory,
      "Tell the user this is the scheduled reminder.",
      { stream: true }
    );
    speak(stream);
    return next;
  }

  counter.current = counter.current + 1;
  log("interaction", counter.current);
  const [next, stream] = await externalDialog(
    workingMemory,
    "Briefly acknowledge the user.",
    { stream: true }
  );
  speak(stream);
  if (counter.current >= 2) {
    expire();
  }
  return next;
};

export default interact;
