

export const signup = async (req, res) => {
    try {
        const {username, email, password} = req.body;
        const user = await createUser({ username, email, password });
        const token = generateToken(user);
        res.json({ token, user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await loginUser({ email, password });
    const token = generateToken(user);
    res.json({ token, user });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};