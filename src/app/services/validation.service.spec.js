describe('Validation Service', () => {
    it('should validate a valid input', () => {
        const result = validateInput('validInput');
        expect(result).toBe(true);
    });

    it('should invalidate an invalid input', () => {
        const result = validateInput('invalidInput');
        expect(result).toBe(false);
    });
});