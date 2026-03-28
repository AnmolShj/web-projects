import streamlit as st

st.set_page_config(page_title="AI Realtor App", page_icon="🏠", layout="wide")

st.title("🏠 AI Realtor App")
st.caption("Streamlit version of your AI-powered real estate assistant platform")

st.markdown(
    """
Welcome to the **AI Realtor App** — a platform designed to help real estate agents
automate marketing, generate listings, capture leads, and produce market insights.
"""
)

st.subheader("🌟 Core Features")
col1, col2 = st.columns(2)

with col1:
    st.markdown(
        """
- 🎥 **AI Reel Generator**
  - Generate short property marketing reels
  - Auto script ideas and voiceover-ready copy

- 📝 **AI Listing Generator**
  - Create MLS, social, and email property descriptions
  - Fast multi-channel listing content

- 🤖 **LeadBot Assistant**
  - Conversational property Q&A
  - Captures lead details (name/email/phone)
"""
    )

with col2:
    st.markdown(
        """
- 📊 **Market Reports**
  - Neighborhood highlights and pricing summaries
  - Seller/buyer-ready insights

- 🛋️ **Virtual Staging**
  - Style suggestions for empty rooms
  - Better listing presentation

- 📈 **Lead Dashboard**
  - Track lead stages and follow-up status
  - Organize pipeline in one place
"""
    )

st.subheader("⚙️ Quick Demo Controls")
feature = st.selectbox(
    "Choose a module to preview",
    [
        "Dashboard Overview",
        "AI Listing Generator",
        "AI Reel Generator",
        "LeadBot",
        "Market Report",
        "Virtual Staging",
    ],
)

if feature == "Dashboard Overview":
    st.success("Dashboard: monitor leads, listing activity, and marketing performance.")
elif feature == "AI Listing Generator":
    st.info("Listing Generator: produce high-converting property copy from core details.")
elif feature == "AI Reel Generator":
    st.info("Reel Generator: create short-form video concepts/scripts for social channels.")
elif feature == "LeadBot":
    st.info("LeadBot: answer buyer questions and collect lead contact information.")
elif feature == "Market Report":
    st.info("Market Report: summarize neighborhood trends and pricing intelligence.")
elif feature == "Virtual Staging":
    st.info("Virtual Staging: present style concepts for vacant listing photos.")

st.subheader("🧾 Property Input (Sample)")
with st.form("property_form"):
    address = st.text_input("Property Address")
    beds = st.number_input("Bedrooms", min_value=0, max_value=20, value=3)
    baths = st.number_input("Bathrooms", min_value=0.0, max_value=20.0, value=2.0, step=0.5)
    sqft = st.number_input("Square Feet", min_value=0, value=1500)
    tone = st.selectbox("Listing Tone", ["Luxury", "Professional", "Friendly", "Investor-focused"])
    submitted = st.form_submit_button("Generate Sample Listing")

if submitted:
    st.markdown("### Generated Sample Listing")
    st.write(
        f"Welcome to **{address or 'this beautiful home'}** featuring **{beds} bedrooms**, "
        f"**{baths} bathrooms**, and approximately **{sqft} sq ft** of thoughtfully designed space. "
        f"This {tone.lower()} listing highlights comfort, functionality, and neighborhood value."
    )

st.markdown("---")
st.caption("Built for Streamlit deployment • Main file: app.py")
