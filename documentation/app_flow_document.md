# App Flow Document

## Onboarding and Sign-In/Sign-Up
When a new user arrives on the platform, they land on a welcoming page that offers language selection (French, English, or Chinese). From there, they can choose to sign up or sign in using their email address and a secure password. To create an account, the user enters their name, email, and password, then confirms the email address through a verification link sent automatically. Once verified, they can access the application. If a user forgets their password, they click a “Forgot password” link, enter their registered email, and receive a reset link to establish a new password. There is no social or OAuth login at launch; all accounts are managed via email and password. Signing out is available at any time from the user menu in the top navigation bar.

## Main Dashboard or Home Page
After logging in, the user sees a clean dashboard that displays their existing projects. The header shows the application logo and a language toggle. On the left side, a vertical menu lists options for Projects, Settings, and Help. The main area shows tiles for each project with the project name, country flags, and last updated date. A prominent button invites the user to create a new project. The dashboard also highlights the user’s subscription status (Free or Premium) and remaining project slots if the user is on the freemium tier. From this page, clicking on a project tile opens that project. The “Settings” link leads to account options, while the “Help” link points to documentation and support.

## Detailed Feature Flows and Page Transitions

### Project Creation
When the user clicks “Create New Project,” a form appears prompting for a project name and optional description. The user selects default countries (Gabon and China) or chooses additional countries from a dropdown. Once the user submits this form, the project is created and the interface transitions to the project’s workspace, which includes tabs for Import, Data Entry, Comparison Table, and Export.

### File Import and AI Mapping
In the Import tab, the user chooses to upload a file (PDF, CSV, Excel) or provide a public Google Sheet link. After the user uploads the file or enters the link, the backend calls GPT-4o to analyze and map columns. The interface displays a loading indicator while the AI processes the document. When complete, the user is shown a preview of the detected columns mapped to fields such as SKU, quantity, general characteristic, weight, and volume.

### Mapping Preview and Correction
The mapping preview page shows a table with the original document’s column names and the proposed field assignments. The user can click any mapped field to change it manually or assign additional fields. Once satisfied, the user clicks Confirm to import the data into the project, and the app moves to the Data Entry tab.

### Data Entry and Enrichment
In the Data Entry tab, each material line appears with editable fields for each country. The user enters price in local currency (CFA for Gabon, RMB for China), supplier name, product photo, references, and any logistical notes including weight and volume. As the user fills in values, the app saves changes in real time. The user can switch between countries using a dropdown in the table header to focus on one country’s details at a time.

### Interactive Comparison Table
Switching to the Comparison Table tab shows a live table where prices from different countries display side by side. Each price column uses the manually set exchange rate to convert to a reference currency if needed. Differences between prices are calculated automatically and shown in a highlighted column. The user can filter by country, price range, category, supplier, or price gap, and search by product name or reference. Sorting by ascending or descending price, price difference, name, or supplier is available by clicking the column headers. The interface updates instantly when the user changes a filter, modifies a price, or adjusts the exchange rate.

### Product Detail View
Clicking a product row opens a detail view overlay. This view presents the product photo in larger size, full technical specifications, references, prices for each country, and the estimated transport cost based on weight or volume. The user can edit any field directly in this overlay. A “Close” button returns them to the comparison table.

### Export and Sharing
When ready to share results, the user navigates to the Export tab. They choose between PDF or Excel format and select whether to include the company logo and custom headers. The user clicks Generate, and the system builds a professional report, then shows a download link. If the user is on the free plan and has reached their export limit, a prompt explains the benefits of upgrading to Premium for unlimited exports.

### Monetization Model and Role-Based Access
Administrators access additional workspace settings via a gear icon. They can manage user roles (Administrator, Editor, Reader), set or adjust manual exchange rates, and configure global options like available languages and country lists. Editors can import files, edit data, and run exports. Readers can view comparison tables and download reports but cannot modify data. If a Reader or Editor tries to access an admin-only function, they see a friendly error message explaining insufficient permissions.

## Settings and Account Management
In the Settings section, the user can update personal details such as name, email, and password. They can also switch the interface language or log out. Premium users have a Billing tab where they can view their subscription status, invoice history, and change payment methods. Administrators see extra tabs for User Management, where they invite new team members via email, assign roles, or deactivate accounts. After saving changes in Settings, the user returns to their previous page in the main app flow.

## Error States and Alternate Paths
If the user enters invalid data during mapping or data entry, inline validation messages appear next to the affected fields, explaining what needs to be corrected. If the AI fails to map columns, the system displays a message suggesting the user try a different file format or manually specify a template. In case of a lost internet connection, the app shows a banner warning and retries actions automatically once connectivity is restored. Attempting to exceed the free plan limits triggers a prompt detailing upgrade options. Unauthorized page access redirects the user to the dashboard with an explanation notification.

## Conclusion and Overall App Journey
From signing up in their preferred language to creating and configuring a comparison project, the user moves seamlessly through AI-powered import, validation, data entry, and real-time comparison. They refine data, view detailed product information, and generate professional export files. Administrators oversee the environment through role and rate management, while Editors and Readers collaborate on data entry and analysis. This clear, guided flow ensures that project managers and buyers can efficiently compare equipment costs across countries, supported by intuitive UI, AI mapping, and precise export features.