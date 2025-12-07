export default function UserCard({ "user-id": userId }) {
  return `<div class="user-card">
    <strong>Usuario:</strong> ${userId}
  </div>`;
}

// Note: must be default to get easily the component in ssr.js utils
