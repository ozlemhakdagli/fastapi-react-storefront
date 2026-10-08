<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Siparisler extends CI_Controller {

	function __construct()
	{
		parent :: __construct();
		$this->load->library(array('upload','session'));
		$this->load->helper('url');
		$this->load->database();
		
		$this->load->model('Database_Model');
		$this->load->helper(array('form','url'));
		if(! $this->session->userdata('oturum_data')){
		redirect(base_url().'admin/login');}
	} 
	public function index()
	
	{	  
	$query = $this->db->query("SELECT * FROM siparisler  WHERE durum='Yeni' ORDER BY Id desc" );
	$data['veriler']=$query->result();
	$data['sayfa']='Siparişler';
	$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$this->load->view('admin/siparis_listesi',$data);
		$this->load->view('admin/footer');
		
		
		
	}
	public function siparis_detay($id)
	
	{

		$data['sayfa']='Sipariş Detayı';
		$query=$this->db->get("ayarlar");
		$data["veri"]=$query->result();
		
		
		
		$query=$this->db->query("SELECT * FROM siparisler WHERE Id=$id");
		$data["siparis"]=$query->result();
		
		$query=$this->db->query("SELECT * FROM siparis_urunler WHERE siparis_id=$id");
		$data["urunler"]=$query->result();
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
	
		$this->load->view('admin/siparis_detay',$data);
		$this->load->view('admin/footer');
	}
		
	
	public function siparisler_onayli()
	
	{	  
	    	$data['sayfa']='Onaylanan Siparişler';
	$query = $this->db->query("SELECT * FROM siparisler  WHERE durum='Onaylandı' ORDER BY Id desc" );
	$data['veriler']=$query->result();
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$this->load->view('admin/siparis_listesi_onaylanmıs',$data);
		$this->load->view('admin/footer');
		
		
		
	}
	public function siparisler_reddedildi()
	
	{	  $data['sayfa']='Red Edilen Siparişler';
	$query = $this->db->query("SELECT * FROM siparisler  WHERE durum='Reddedildi' ORDER BY Id desc" );
	$data['veriler']=$query->result();
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$this->load->view('admin/siparis_listesi_reddedildi',$data);
		$this->load->view('admin/footer');
	
		
		
	}
	public function siparisler_iptal()
	
	{	  $data['sayfa']='İptal Edilen Siparişler';
	$query = $this->db->query("SELECT * FROM siparisler  WHERE durum='İptal Edildi' ORDER BY Id desc" );
	$data['veriler']=$query->result();
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$this->load->view('admin/siparis_listesi_iptal',$data);
		$this->load->view('admin/footer');
		
		
		
	}
	public function siparisler_kargodaki()
	
	{	  $data['sayfa']='Kargodaki Siparişler';
	$query = $this->db->query("SELECT * FROM siparisler  WHERE durum='Kargoda' ORDER BY Id desc" );
	$data['veriler']=$query->result();
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$this->load->view('admin/siparis_listesi_kargoda',$data);
		$this->load->view('admin/footer');
	
		
		
	}
	public function siparisler_tamamlanan()
	
	{	  $data['sayfa']='Tamamlanan Siparişler';
	$query = $this->db->query("SELECT * FROM siparisler  WHERE durum='Tamamlandı' ORDER BY Id desc" );
	$data['veriler']=$query->result();
	$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$this->load->view('admin/siparis_listesi_tamamlanmıs',$data);
		$this->load->view('admin/footer');
	
		
	}
	
	
	public function siparisguncelle($id)
	{		
		$data=array(
			'kargofirma'   => $this->input->post('kargofirma'),
			'kargono' => $this->input->post('kargono'),
			'durum' => $this->input->post('durum'),
			'adminaciklama' => $this->input->post('adminaciklama'),
			
			);
			$this->Database_Model->update_data("siparisler",$data,$id);
			$this->session->set_flashdata('sonuc','Güncelleme işlemi başarılıdır!');
			redirect (base_url()."admin/siparisler/");
			
		
		
	}
    public function s_delete($id)
	{		
		$this->db->query("DELETE FROM siparisler WHERE Id=$id");
		$this->session->set_flashdata('sonuc','Silme  işlemi başarılıdır!');
		redirect (base_url()."admin/siparisler");
			
		
		
	}
	public function delete($id)
	{		
		$this->db->query("DELETE FROM urunler WHERE Id=$id");
		$this->session->set_flashdata('sonuc','Silme  işlemi başarılıdır!');
		redirect (base_url()."admin/urunler");
			
		
		
	}
	public function siparisdelete($id)
	{		
		$this->db->query("DELETE FROM siparisler WHERE Id=$id");
		$this->session->set_flashdata('sonuc','Silme  işlemi başarılıdır!');
		redirect (base_url()."admin");
			
		
		
	}
	public function preview($id)
	{	$data['sayfa']=' Sipariş Görüntüle';	
		$sorgu=$this->db->query("SELECT * FROM urunler WHERE ID=$id");
		$data["veri"]=$sorgu->result();
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');	
		$this->load->view('admin/urunler_goster',$data);
		$this->load->view('admin/footer');
			
	}
	
	
	
	}
		      

                
				

               
      
		

