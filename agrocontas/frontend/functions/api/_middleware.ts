import { handleCorsPreflight } from "../utils/httpResponse";

export const onRequestOptions: PagesFunction = async () => {
  return handleCorsPreflight();
};
