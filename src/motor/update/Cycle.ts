import { Priority } from "../Priority";
import { UpdatePayload } from "./UpdatePayload";

export interface Cycle<T = undefined> {
  readonly refresh: (updatePayload: UpdatePayload<T>) => void;
  priority?: Priority;
}
