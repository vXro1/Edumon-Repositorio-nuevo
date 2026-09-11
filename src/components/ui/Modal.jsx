// backward-compatible wrapper over AppModal
import AppModal from "./AppModal";

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  closeOnOverlay = true,
}) {
  return (
    <AppModal isOpen={isOpen} onClose={onClose} size={size} closeOnOverlay={closeOnOverlay}>
      {title && (
        <AppModal.Header title={title} description={description} onClose={onClose} />
      )}
      <AppModal.Body>{children}</AppModal.Body>
    </AppModal>
  );
}
