import api from './axios';

export const importCsv = (file, groupId) => {
  const formData = new FormData();
  formData.append('file', file);
  if (groupId) {
    formData.append('groupId', groupId);
  }
  return api.post('/import/csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};
