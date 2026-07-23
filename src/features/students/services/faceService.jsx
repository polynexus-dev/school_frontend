import api from "../../../services/api";

// POST /api/face-embeddings/register/  multipart {student, angle, image} -> FaceEmbedding
// 403 if the student has no verified guardian's face_recognition consent yet.
const registerFace = async ({ studentId, angle, imageBlob }) => {
  const formData = new FormData();
  formData.append("student", studentId);
  formData.append("angle", angle);
  formData.append("image", imageBlob, `${angle}.jpg`);
  const response = await api.post("face-embeddings/register/", formData);
  return { status: response.status, data: response.data };
};

const faceService = { registerFace };

export default faceService;
