import CertificateData
set_option maxRecDepth 100000
set_option maxHeartbeats 0
namespace Pinwheel.Certificate
theorem checked_t1465 : checkTree 35 cert t1465 = true := by decide +kernel
end Pinwheel.Certificate
