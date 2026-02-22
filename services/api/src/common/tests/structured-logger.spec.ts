import { Test, TestingModule } from '@nestjs/testing';
import { StructuredLoggerService } from '../services/structured-logger.service';

describe('StructuredLoggerService', () => {
    let service: StructuredLoggerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [StructuredLoggerService],
        }).compile();

        service = module.get<StructuredLoggerService>(StructuredLoggerService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('context management', () => {
        it('should set and get context', () => {
            service.setContext('TestContext');
            expect(service['context']).toBe('TestContext');
        });

        it('should reset context', () => {
            service.setContext('TestContext');
            service.resetContext();
            expect(service['context']).toBe('Application');
        });
    });

    describe('logging methods', () => {
        it('should log info level messages', () => {
            const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            service.log('Test message', undefined, { field: 'value' });
            expect(logSpy).toHaveBeenCalled();
            logSpy.mockRestore();
        });

        it('should log error level messages', () => {
            const errorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation(() => { });
            const error = new Error('Test error');
            service.error('Error message', error, undefined, { field: 'value' });
            expect(errorSpy).toHaveBeenCalled();
            errorSpy.mockRestore();
        });

        it('should log warning level messages', () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
            service.warn('Warning message', { field: 'value' });
            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });

        it('should log debug level messages', () => {
            const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            service.debug('Debug message', { field: 'value' });
            expect(logSpy).toHaveBeenCalled();
            logSpy.mockRestore();
        });

        it('should log verbose level messages', () => {
            const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            service.verbose('Verbose message', { field: 'value' });
            expect(logSpy).toHaveBeenCalled();
            logSpy.mockRestore();
        });
    });

    describe('HTTP logging methods', () => {
        it('should log HTTP requests', () => {
            const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            service.logRequest('GET', '/api/test', {}, '127.0.0.1');
            expect(logSpy).toHaveBeenCalled();
            logSpy.mockRestore();
        });

        it('should log HTTP responses', () => {
            const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            service.logResponse(200, 'OK', {}, 100);
            expect(logSpy).toHaveBeenCalled();
            logSpy.mockRestore();
        });
    });

    describe('metadata formatting', () => {
        it('should format metadata correctly', () => {
            const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            service.log('Message', undefined, {
                userId: '123',
                action: 'create',
                duration: 45,
            });

            const callArgs = logSpy.mock.calls[0][0];
            expect(callArgs).toContain('userId=123');
            expect(callArgs).toContain('action=create');
            expect(callArgs).toContain('duration=45');

            logSpy.mockRestore();
        });
    });

    describe('error with stack trace', () => {
        it('should include stack trace in error logs', () => {
            const errorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation(() => { });
            const error = new Error('Test error');
            service.error('Error occurred', error);

            expect(errorSpy).toHaveBeenCalled();

            errorSpy.mockRestore();
        });
    });
});
