export default async function UserCardDelayed2({ userId }) {
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const userDetails = {
    id: userId,
    name: `User ${userId}`,
  };

  return `
    <div class="user-card">
      <strong>Usuario:</strong> ${userId}
      <div>Nombre: ${userDetails.name}</div>
    </div>
  `;
}
