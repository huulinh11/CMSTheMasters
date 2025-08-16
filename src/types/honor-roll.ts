export type Honoree = {
  guest_id: string;
  guest_name: string;
};

export type Presenter = {
  guest_id: string;
  guest_name: string;
};

export type HonorCategory = {
  id: string;
  name: string;
  order: number;
  honorees: Honoree[] | null;
  presenters: Presenter[] | null;
  created_at: string;
};

export type HonorCategoryFormValues = {
  name: string;
  honorees: Honoree[];
  presenters: Presenter[];
};