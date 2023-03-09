import React, { createContext, useContext } from "react";
import { VirtualOSBrowserCore } from "../supabase";

export const AuthContext = createContext("");

interface Props {
    children: React.ReactNode;
}
export const AuthProvider = (props: Props) => {
    const { children } = props;

    const [user, setUser] = React.useState();

    React.useEffect(() => {
        const getUserInfor = async () => {
            const supabase = new VirtualOSBrowserCore();
            const { user } = await supabase.getUserInfor();
            setUser(user);
        };
        getUserInfor();
    }, []);
    const isUserAuthenticated = ():boolean => !!user?.email;

    console.log(user);

    return (
        <AuthContext.Provider value={{ user, setUser, isUserAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};
export function useAuth() {
    return useContext(AuthContext);
}
