export default async function UserCardDelayed({ userId }) {
  await new Promise((resolve) => setTimeout(resolve, 1000));

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
