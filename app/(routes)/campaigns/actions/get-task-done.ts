import axios from "axios";

//Actions
export const getTaskDone = async (taskId: string) => {
  try {
    await axios.post(`/api/campaigns/tasks/mark-task-as-done/${taskId}`);
  } catch (error) {
    console.log(error);
  }
};

export const undoTaskDone = async (taskId: string) => {
  try {
    await axios.post(`/api/campaigns/tasks/mark-task-as-active/${taskId}`);
  } catch (error) {
    console.log(error);
  }
};
