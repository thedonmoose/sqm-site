interface Web3FormsResult {
  success?: boolean;
  message?: string;
}

const WEB3FORMS_URL = "https://api.web3forms.com/submit";

function setStatus(form: HTMLFormElement, message: string): void {
  const status = form.querySelector<HTMLElement>("[data-form-status]");
  if (!status) return;
  status.textContent = message;
  status.hidden = false;
}

function initForm(form: HTMLFormElement): void {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const key = form.querySelector<HTMLInputElement>("input[name='access_key']")?.value.trim();
    if (!key) {
      setStatus(
        form,
        "This form isn't connected yet. Online enquiries will be available soon — please check back.",
      );
      return;
    }

    const button = form.querySelector<HTMLButtonElement>("button[type='submit']");
    const originalLabel = button?.textContent;
    if (button) {
      button.disabled = true;
      button.textContent = "Sending…";
    }

    try {
      const payload = Object.fromEntries(new FormData(form));
      const response = await fetch(WEB3FORMS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as Web3FormsResult;
      if (!response.ok || !result.success) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      form.reset();
      const fields = form.querySelector<HTMLElement>("[data-form-fields]");
      if (fields) fields.hidden = true;
      if (button) button.hidden = true;
      setStatus(form, form.dataset.successMessage || "Message sent.");
    } catch {
      setStatus(form, form.dataset.errorMessage || "Something went wrong. Please try again.");
      if (button) {
        button.disabled = false;
        if (originalLabel) button.textContent = originalLabel;
      }
    }
  });
}

document.querySelectorAll<HTMLFormElement>("form[data-web3forms]").forEach(initForm);
