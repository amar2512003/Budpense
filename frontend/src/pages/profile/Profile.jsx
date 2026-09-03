import { useEffect, useState } from "react";

import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import useAuthStore from "../../store/authStore";
import { isValidEmail, isValidPassword } from "../../utils/validators";

const emptyPasswordForm = {
  currentPassword: "",
  password: "",
  confirmPassword: "",
};

const Profile = () => {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const changePassword = useAuthStore((state) => state.changePassword);

  const [formData, setFormData] = useState({ name: "", email: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState(emptyPasswordForm);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    setFormData({ name: user?.name || "", email: user?.email || "" });
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({ ...previous, [name]: value }));
    setError("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      await updateProfile(formData);
      setMessage("Profile updated successfully.");
    } catch (updateError) {
      setError(updateError.message || "Unable to update your profile.");
    }
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setPasswordData(emptyPasswordForm);
    setPasswordError("");
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordData((previous) => ({ ...previous, [name]: value }));
    setPasswordError("");
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (!isValidPassword(passwordData.password)) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      await changePassword(passwordData);
      closePasswordModal();
      setMessage("Password updated successfully.");
    } catch (changeError) {
      setPasswordError(changeError.message || "Unable to change your password.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your personal information.
        </p>
      </div>

      <Card title="Personal Information" description="Update your account details.">
        {message && (
          <div className="mb-5 rounded-lg bg-green-50 p-3 text-sm text-green-600">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-600">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                {user?.name || "Your Profile"}
              </h3>
              <p className="text-sm text-gray-500">
                {user?.email || "Budpense account"}
              </p>
            </div>
          </div>

          <Input
            label="Full Name"
            name="name"
            placeholder="Your name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <div className="flex justify-end">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Card>

      <Card title="Security" description="Manage your account password.">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-medium text-gray-900">Password</p>
            <p className="mt-1 text-sm text-gray-500">
              Change your password regularly to keep your account secure.
            </p>
          </div>

          <Button variant="outline" onClick={() => setIsPasswordModalOpen(true)}>
            Change Password
          </Button>
        </div>
      </Card>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={closePasswordModal}
        title="Change Password"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          {passwordError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {passwordError}
            </div>
          )}

          <Input
            label="Current Password"
            name="currentPassword"
            type="password"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            required
          />

          <Input
            label="New Password"
            name="password"
            type="password"
            value={passwordData.password}
            onChange={handlePasswordChange}
            required
          />

          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            required
          />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={closePasswordModal}>
              Cancel
            </Button>
            <Button type="submit">Update Password</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Profile;
