

const Footer: React.FC = () => {
    return (
        <footer className="w-full flex items-center bg-blue-900 text-blue-50 p-4">
            <aside className="mx-auto ">
                <p>Copyright © {new Date().getFullYear()} - All right reserved by WCRAdmin</p>
            </aside>
            <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

        </footer>
    )
}

export default Footer